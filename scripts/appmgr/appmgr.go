package main

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/manifoldco/promptui"
)

type Config struct {
	ServerPort    string
	WebPort       string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	RedisHost     string
	RedisPort     string
	RedisPassword string
}

type Service struct {
	Name        string
	DisplayName string
	Status      string
	PID         int
}

var (
	projectRoot string
	config      Config
)

func init() {
	var err error
	projectRoot, err = findProjectRoot()
	if err != nil {
		fmt.Printf("Error: Cannot find project root: %v\n", err)
		os.Exit(1)
	}

	if err := loadConfig(); err != nil {
		fmt.Printf("Error: Failed to load config: %v\n", err)
		os.Exit(1)
	}
}

func findProjectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for i := 0; i < 4; i++ {
		if _, err := os.Stat(filepath.Join(dir, ".env")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Dir(exePath), nil
}

func loadConfig() error {
	envPath := filepath.Join(projectRoot, ".env")
	if err := godotenv.Load(envPath); err != nil {
		return err
	}

	config = Config{
		ServerPort:    getEnv("SERVER_PORT", "2048"),
		WebPort:       getEnv("WEB_PORT", "2000"),
		DBHost:        getEnv("DB_HOST", "127.0.0.1"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "asagity"),
		DBPassword:    getEnv("DB_PASSWORD", "example_password"),
		DBName:        getEnv("DB_NAME", "asagity_db"),
		RedisHost:     getEnv("REDIS_HOST", "127.0.0.1"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func printWarning() {
	fmt.Println("\033[1;33m╔════════════════════════════════════════════════════════════╗\033[0m")
	fmt.Println("\033[1;33m║  This script is ONLY recommended for use in development      ║\033[0m")
	fmt.Println("\033[1;33m║  environments!!                                          ║\033[0m")
	fmt.Println("\033[1;33m║                                                            ║\033[0m")
	fmt.Println("\033[1;33m║  For production, use Docker/Podman orchestration instead.  ║\033[0m")
	fmt.Println("\033[1;33m╚════════════════════════════════════════════════════════════╝\033[0m")
	fmt.Println()
}

func startAPI() error {
	coreDir := filepath.Join(projectRoot, "core")
	if _, err := os.Stat(coreDir); err != nil {
		return fmt.Errorf("core directory not found: %v", err)
	}

	cmd := exec.Command("go", "run", ".")
	cmd.Dir = coreDir
	cmd.Env = append(os.Environ(), "TZ="+getEnv("TZ", "Asia/Shanghai"))

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start API: %v", err)
	}

	fmt.Printf("\033[32m[OK]\033[0m API server started (PID: %d)\n", cmd.Process.Pid)

	go func() {
		cmd.Wait()
		fmt.Printf("\033[33m[WARN]\033[0m API server stopped\n")
	}()

	return nil
}

func startWeb() error {
	webDir := filepath.Join(projectRoot, "web")
	if _, err := os.Stat(webDir); err != nil {
		return fmt.Errorf("web directory not found: %v", err)
	}

	cmd := exec.Command("npm", "run", "dev")
	cmd.Dir = webDir
	cmd.Env = append(os.Environ(), "NITRO_PORT="+config.WebPort)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start Web: %v", err)
	}

	fmt.Printf("\033[32m[OK]\033[0m Web server started (PID: %d)\n", cmd.Process.Pid)

	go func() {
		cmd.Wait()
		fmt.Printf("\033[33m[WARN]\033[0m Web server stopped\n")
	}()

	return nil
}

func startDB() error {
	composeDir := filepath.Join(projectRoot, "container", "docker")
	composeFile := filepath.Join(composeDir, "docker-compose-only-db.yaml")

	if _, err := os.Stat(composeFile); err != nil {
		composeFile = filepath.Join(composeDir, "docker-compose.yaml")
		if _, err := os.Stat(composeFile); err != nil {
			return fmt.Errorf("docker-compose file not found")
		}
	}

	cmd := exec.Command("docker", "compose", "-f", composeFile, "up", "-d", "postgres")
	cmd.Dir = projectRoot

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to start database: %v\n%s", err, output)
	}

	fmt.Printf("\033[32m[OK]\033[0m PostgreSQL container started\n")
	return nil
}

func startRedis() error {
	composeDir := filepath.Join(projectRoot, "container", "docker")
	composeFile := filepath.Join(composeDir, "docker-compose-only-db.yaml")

	if _, err := os.Stat(composeFile); err != nil {
		composeFile = filepath.Join(composeDir, "docker-compose.yaml")
		if _, err := os.Stat(composeFile); err != nil {
			return fmt.Errorf("docker-compose file not found")
		}
	}

	cmd := exec.Command("docker", "compose", "-f", composeFile, "up", "-d", "redis")
	cmd.Dir = projectRoot

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to start redis: %v\n%s", err, output)
	}

	fmt.Printf("\033[32m[OK]\033[0m Redis container started\n")
	return nil
}

func stopService(name string) error {
	switch name {
	case "db":
		cmd := exec.Command("docker", "stop", "postgres")
		cmd.Dir = projectRoot
		cmd.Run()
		fmt.Printf("\033[33m[STOP]\033[0m PostgreSQL container stopped\n")
	case "redis":
		cmd := exec.Command("docker", "stop", "redis")
		cmd.Dir = projectRoot
		cmd.Run()
		fmt.Printf("\033[33m[STOP]\033[0m Redis container stopped\n")
	}
	return nil
}

func restartService(name string) error {
	fmt.Printf("\033[33m[RESTART]\033[0m Restarting %s...\n", name)
	if err := stopService(name); err != nil {
		return err
	}
	time.Sleep(1 * time.Second)

	switch name {
	case "api":
		return startAPI()
	case "web":
		return startWeb()
	case "db":
		return startDB()
	case "redis":
		return startRedis()
	}
	return nil
}

func getServiceStatus(name string) Service {
	s := Service{
		Name:        name,
		DisplayName: name,
		Status:      "\033[90mSTOPPED\033[0m",
		PID:         0,
	}

	switch name {
	case "api":
		s.DisplayName = "Go API Server"
		if checkPort("127.0.0.1", config.ServerPort) {
			s.Status = "\033[32mRUNNING\033[0m"
			if pid := getProcessPID(config.ServerPort); pid > 0 {
				s.PID = pid
			}
		}
	case "web":
		s.DisplayName = "Nuxt Web"
		if checkPort("127.0.0.1", config.WebPort) {
			s.Status = "\033[32mRUNNING\033[0m"
			if pid := getWebPID(); pid > 0 {
				s.PID = pid
			}
		}
	case "db":
		s.DisplayName = "PostgreSQL"
		if checkContainerRunning("postgres") {
			s.Status = "\033[32mRUNNING\033[0m"
		}
	case "redis":
		s.DisplayName = "Redis"
		if checkContainerRunning("redis") {
			s.Status = "\033[32mRUNNING\033[0m"
		}
	}

	return s
}

func getProcessPID(port string) int {
	cmd := exec.Command("lsof", "-t", "-i", ":"+port)
	output, err := cmd.Output()
	if err != nil {
		return 0
	}
	var pid int
	fmt.Sscanf(string(output), "%d", &pid)
	return pid
}

func getWebPID() int {
	cmd := exec.Command("pgrep", "-f", "nuxt|vite")
	output, err := cmd.Output()
	if err != nil {
		return 0
	}
	var pid int
	fmt.Sscanf(string(output), "%d", &pid)
	return pid
}

func checkContainerRunning(name string) bool {
	cmd := exec.Command("docker", "ps", "--filter", "name="+name, "--format", "{{.Names}}")
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	return len(output) > 0
}

func checkPort(host, port string) bool {
	address := net.JoinHostPort(host, port)
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

func checkHealth() bool {
	if !checkPort("127.0.0.1", config.ServerPort) {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "GET", "http://127.0.0.1:"+config.ServerPort+"/healthz", nil)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

func showLogs(service string) error {
	switch service {
	case "api":
		coreDir := filepath.Join(projectRoot, "core")
		cmd := exec.Command("go", "run", ".")
		cmd.Dir = coreDir
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	case "web":
		webDir := filepath.Join(projectRoot, "web")
		cmd := exec.Command("npm", "run", "dev")
		cmd.Dir = webDir
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	case "db":
		cmd := exec.Command("docker", "logs", "-f", "--tail=50", "postgres")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	case "redis":
		cmd := exec.Command("docker", "logs", "-f", "--tail=50", "redis")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	}
	return nil
}

func printStatus() {
	fmt.Println("\033[36m╔═══════════════════════════════════════════════════════╗\033[0m")
	fmt.Println("\033[36m║              Asagity Services Status                   ║\033[0m")
	fmt.Println("\033[36m╚═══════════════════════════════════════════════════════╝\033[0m")
	fmt.Println()

	serviceNames := []string{"api", "web", "db", "redis"}

	fmt.Printf("\033[90m%-12s %-20s %-12s %-8s\033[0m\n", "SERVICE", "NAME", "STATUS", "PID")
	fmt.Println("─────────────────────────────────────────────────────────────────")

	for _, name := range serviceNames {
		s := getServiceStatus(name)
		status := s.Status
		pidStr := "-"
		if s.PID > 0 {
			pidStr = fmt.Sprintf("%d", s.PID)
		}
		fmt.Printf("%-12s %-20s %-12s %-8s\n", s.Name, s.DisplayName, status, pidStr)
	}

	fmt.Println()
	if checkHealth() {
		fmt.Println("\033[32m[HEALTH] API server is healthy\033[0m")
	} else {
		fmt.Println("\033[31m[HEALTH] API server is unhealthy or not responding\033[0m")
	}
}

func interactiveMenu() {
	printWarning()

	for {
		prompt := promptui.Select{
			Label: "Select action",
			Items: []string{
				"Start All Services",
				"Stop All Services",
				"Restart All Services",
				"Show Status",
				"Show Logs (API)",
				"Show Logs (Web)",
				"Show Logs (DB)",
				"Show Logs (Redis)",
				"Health Check",
				"Exit",
			},
		}

		_, result, err := prompt.Run()
		if err != nil {
			return
		}

		fmt.Println()
		switch result {
		case "Start All Services":
			services := []string{"db", "redis", "api", "web"}
			for _, name := range services {
				if getServiceStatus(name).PID == 0 {
					restartService(name)
				} else {
					fmt.Printf("\033[90m[WARN]\033[0m %s already running\n", name)
				}
			}
		case "Stop All Services":
			services := []string{"api", "web", "db", "redis"}
			for _, name := range services {
				stopService(name)
			}
		case "Restart All Services":
			services := []string{"api", "web", "db", "redis"}
			for _, name := range services {
				restartService(name)
			}
		case "Show Status":
			printStatus()
		case "Show Logs (API)":
			showLogs("api")
		case "Show Logs (Web)":
			showLogs("web")
		case "Show Logs (DB)":
			showLogs("db")
		case "Show Logs (Redis)":
			showLogs("redis")
		case "Health Check":
			if checkHealth() {
				fmt.Println("\033[32m[OK] API server is healthy\033[0m")
			} else {
				fmt.Println("\033[31m[FAIL] API server is not healthy\033[0m")
			}
		case "Exit":
			return
		}
		fmt.Println()
	}
}

func main() {
	printWarning()

	if len(os.Args) < 2 {
		interactiveMenu()
		return
	}

	command := os.Args[1]

	switch command {
	case "start":
		if len(os.Args) < 3 {
			fmt.Println("Usage: appmgr start <service|all>")
			os.Exit(1)
		}
		service := os.Args[2]
		if service == "all" {
			services := []string{"db", "redis", "api", "web"}
			for _, name := range services {
				restartService(name)
			}
		} else {
			restartService(service)
		}

	case "stop":
		if len(os.Args) < 3 {
			fmt.Println("Usage: appmgr stop <service|all>")
			os.Exit(1)
		}
		service := os.Args[2]
		if service == "all" {
			services := []string{"api", "web", "db", "redis"}
			for _, name := range services {
				stopService(name)
			}
		} else {
			stopService(service)
		}

	case "restart":
		if len(os.Args) < 3 {
			fmt.Println("Usage: appmgr restart <service|all>")
			os.Exit(1)
		}
		service := os.Args[2]
		if service == "all" {
			services := []string{"api", "web", "db", "redis"}
			for _, name := range services {
				restartService(name)
			}
		} else {
			restartService(service)
		}

	case "status":
		printStatus()
		return

	case "logs":
		if len(os.Args) < 3 {
			fmt.Println("Usage: appmgr logs <service>")
			os.Exit(1)
		}
		service := os.Args[2]
		showLogs(service)

	case "health":
		if checkHealth() {
			fmt.Println("OK")
		} else {
			fmt.Println("FAIL")
			os.Exit(1)
		}
		return

	case "init-db":
		scriptPath := filepath.Join(projectRoot, "scripts", "container", "initDatabase.sh")
		cmd := exec.Command("bash", scriptPath)
		cmd.Dir = projectRoot
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}

	default:
		fmt.Println("Usage: appmgr <command> [service]")
		fmt.Println()
		fmt.Println("Commands:")
		fmt.Println("  start <service|all>    Start services")
		fmt.Println("  stop <service|all>     Stop services")
		fmt.Println("  restart <service|all>  Restart services")
		fmt.Println("  status                  Show status")
		fmt.Println("  logs <service>         Show logs")
		fmt.Println("  health                 Health check")
		fmt.Println("  init-db                Initialize database")
		fmt.Println()
		fmt.Println("Services: api, web, db, redis")
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n\033[33m[WARN]\033[0m Shutting down...")
		os.Exit(0)
	}()

	select {}
}

func readLines(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}