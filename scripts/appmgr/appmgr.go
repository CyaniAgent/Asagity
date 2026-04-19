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
	"strconv"
	"strings"
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
	projectRoot   string
	config        Config
	pidDir        string
	servicePIDs   = map[string]int{}
)

func init() {
	var err error
	projectRoot, err = findProjectRoot()
	if err != nil {
		fmt.Printf("Error: Cannot find project root: %v\n", err)
		os.Exit(1)
	}

	pidDir = filepath.Join(projectRoot, ".appmgr")
	if err := os.MkdirAll(pidDir, 0755); err != nil {
		fmt.Printf("Warning: Cannot create pid directory: %v\n", err)
	}

	if err := loadPIDs(); err != nil {
		fmt.Printf("Warning: Failed to load PIDs: %v\n", err)
	}

	if err := loadConfig(); err != nil {
		fmt.Printf("Error: Failed to load config: %v\n", err)
		os.Exit(1)
	}
}

func findProjectRoot() (string, error) {
	candidates := []string{}

	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		for i := 0; i < 4; i++ {
			candidates = append(candidates, exeDir)
			parent := filepath.Dir(exeDir)
			if parent == exeDir {
				break
			}
			exeDir = parent
		}
	}

	cwd, err := os.Getwd()
	if err == nil {
		for i := 0; i < 4; i++ {
			candidates = append(candidates, cwd)
			parent := filepath.Dir(cwd)
			if parent == cwd {
				break
			}
			cwd = parent
		}
	}

	seen := make(map[string]bool)
	for _, dir := range candidates {
		if dir == "" || seen[dir] {
			continue
		}
		seen[dir] = true
		if _, err := os.Stat(filepath.Join(dir, ".env")); err == nil {
			return dir, nil
		}
		if _, err := os.Stat(filepath.Join(dir, "core")); err == nil {
			return dir, nil
		}
		if _, err := os.Stat(filepath.Join(dir, "web")); err == nil {
			return dir, nil
		}
	}

	return "", fmt.Errorf("project root not found")
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

func loadPIDs() error {
	pidFile := filepath.Join(pidDir, "service.pid")
	data, err := os.ReadFile(pidFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, "=")
		if len(parts) == 2 {
			name := strings.TrimSpace(parts[0])
			pid, err := strconv.Atoi(strings.TrimSpace(parts[1]))
			if err == nil {
				if isProcessRunning(pid) {
					servicePIDs[name] = pid
				} else {
					delete(servicePIDs, name)
				}
			}
		}
	}
	return scanner.Err()
}

func savePIDs() error {
	pidFile := filepath.Join(pidDir, "service.pid")
	var lines []string
	for name, pid := range servicePIDs {
		if pid > 0 && isProcessRunning(pid) {
			lines = append(lines, fmt.Sprintf("%s=%d", name, pid))
		}
	}

	content := strings.Join(lines, "\n")
	if content != "" {
		content += "\n"
	}
	return os.WriteFile(pidFile, []byte(content), 0644)
}

func isProcessRunning(pid int) bool {
	if pid <= 0 {
		return false
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	err = process.Signal(syscall.Signal(0))
	return err == nil
}

func killProcess(pid int) error {
	if pid <= 0 {
		return nil
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	return process.Kill()
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

	if oldPID, ok := servicePIDs["api"]; ok && oldPID > 0 {
		if isProcessRunning(oldPID) {
			killProcess(oldPID)
		}
	}

	cmd := exec.Command("go", "run", ".")
	cmd.Dir = coreDir
	cmd.Env = append(os.Environ(), "TZ="+getEnv("TZ", "Asia/Shanghai"))

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to create stdout pipe: %v", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to create stderr pipe: %v", err)
	}

	cmd.Stdin = os.Stdin
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start API: %v", err)
	}

	pid := cmd.Process.Pid
	servicePIDs["api"] = pid
	savePIDs()

	fmt.Printf("\033[32m[OK]\033[0m API server starting (PID: %d)...\n", pid)

	successChan := make(chan bool, 1)
	go func() {
		reader := bufio.NewReader(stdoutPipe)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				break
			}
			fmt.Print(line)
			if strings.Contains(line, "Asagity API listening on") {
				successChan <- true
			}
		}
	}()

	go func() {
		reader := bufio.NewReader(stderrPipe)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				break
			}
			fmt.Print(line)
		}
	}()

	select {
	case <-successChan:
		fmt.Printf("\033[32m[OK]\033[0m API server started successfully (PID: %d)\n", pid)
	case <-time.After(60 * time.Second):
		fmt.Printf("\033[31m[FAIL]\033[0m API server failed to start within 60s\n")
	}

	go func() {
		cmd.Wait()
		delete(servicePIDs, "api")
		savePIDs()
		fmt.Printf("\033[33m[WARN]\033[0m API server stopped\n")
	}()

	return nil
}

func startWeb() error {
	webDir := filepath.Join(projectRoot, "web")
	if _, err := os.Stat(webDir); err != nil {
		return fmt.Errorf("web directory not found: %v", err)
	}

	if oldPID, ok := servicePIDs["web"]; ok && oldPID > 0 {
		if isProcessRunning(oldPID) {
			killProcess(oldPID)
		}
	}

	cmd := exec.Command("npm", "run", "dev")
	cmd.Dir = webDir
	cmd.Env = append(os.Environ(), "NITRO_PORT="+config.WebPort)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to create stdout pipe: %v", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to create stderr pipe: %v", err)
	}

	cmd.Stdin = os.Stdin
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start Web: %v", err)
	}

	pid := cmd.Process.Pid
	servicePIDs["web"] = pid
	savePIDs()

	fmt.Printf("\033[32m[OK]\033[0m Web server starting (PID: %d)...\n", pid)

	successChan := make(chan bool, 1)
	go func() {
		reader := bufio.NewReader(stdoutPipe)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				break
			}
			fmt.Print(line)
			if strings.Contains(line, "VITE") && strings.Contains(line, "ready in") {
				successChan <- true
			}
		}
	}()

	go func() {
		reader := bufio.NewReader(stderrPipe)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				break
			}
			fmt.Print(line)
			if strings.Contains(line, "VITE") && strings.Contains(line, "ready in") {
				successChan <- true
			}
		}
	}()

	select {
	case <-successChan:
		fmt.Printf("\033[32m[OK]\033[0m Web server started successfully (PID: %d)\n", pid)
	case <-time.After(60 * time.Second):
		fmt.Printf("\033[31m[FAIL]\033[0m Web server failed to start within 60s\n")
	}

	go func() {
		cmd.Wait()
		delete(servicePIDs, "web")
		savePIDs()
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
	if pid, ok := servicePIDs[name]; ok && pid > 0 {
		if isProcessRunning(pid) {
			killProcess(pid)
			delete(servicePIDs, name)
			savePIDs()
			fmt.Printf("\033[33m[STOP]\033[0m %s stopped (PID: %d)\n", name, pid)
		}
	}

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
		fmt.Printf("\033[90m[WARN]\033[0m Failed to stop %s: %v, proceeding with start\n", name, err)
	}
	time.Sleep(500 * time.Millisecond)

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

func startAllServices() {
	order := []string{"db", "redis", "web", "api"}
	failed := []string{}

	fmt.Println("\033[36m[START] Starting all services...\033[0m")

	for _, name := range order {
		s := getServiceStatus(name)
		if s.PID > 0 {
			fmt.Printf("\033[90m[WARN]\033[0m %s already running (PID: %d)\n", name, s.PID)
			continue
		}

		err := startSingleService(name)
		if err != nil {
			fmt.Printf("\033[31m[FAIL]\033[0m %s failed to start: %v\n", name, err)
			failed = append(failed, name)
		}
	}

	fmt.Println()
	if len(failed) == len(order) {
		fmt.Println("\033[31m[ERROR] All services failed to start!\033[0m")
	} else if len(failed) > 0 {
		fmt.Printf("\033[33m[WARN] Failed services: %s\n\033[0m", strings.Join(failed, ", "))
		fmt.Println("\033[32m[OK] Some services started successfully\033[0m")
	} else {
		fmt.Println("\033[32m[OK] All services started successfully\033[0m")
	}
}

func stopAllServices() {
	order := []string{"api", "web", "redis", "db"}
	stopped := []string{}
	failed := []string{}

	fmt.Println("\033[36m[STOP] Stopping all services...\033[0m")

	for _, name := range order {
		s := getServiceStatus(name)
		if s.PID == 0 && name != "db" && name != "redis" {
			continue
		}

		err := stopService(name)
		if err != nil {
			fmt.Printf("\033[31m[FAIL]\033[0m %s failed to stop: %v\n", name, err)
			failed = append(failed, name)
		} else {
			stopped = append(stopped, name)
		}
	}

	fmt.Println()
	if len(stopped) > 0 {
		fmt.Printf("\033[32m[OK] Stopped: %s\033[0m\n", strings.Join(stopped, ", "))
	}
	if len(failed) > 0 {
		fmt.Printf("\033[33m[WARN] Failed to stop: %s\033[0m\n", strings.Join(failed, ", "))
	}
}

func restartAllServices() {
	order := []string{"api", "web", "redis", "db"}
	success := []string{}
	failed := []string{}

	fmt.Println("\033[36m[RESTART] Restarting all services...\033[0m")

	for _, name := range order {
		err := restartService(name)
		if err != nil {
			fmt.Printf("\033[31m[FAIL]\033[0m %s failed to restart: %v\n", name, err)
			failed = append(failed, name)
		} else {
			success = append(success, name)
		}
		time.Sleep(500 * time.Millisecond)
	}

	fmt.Println()
	if len(failed) == len(order) {
		fmt.Println("\033[31m[ERROR] All services failed to restart!\033[0m")
	} else if len(failed) > 0 {
		fmt.Printf("\033[33m[WARN] Failed: %s\033[0m\n", strings.Join(failed, ", "))
		fmt.Printf("\033[32m[OK] Restarted: %s\033[0m\n", strings.Join(success, ", "))
	} else {
		fmt.Println("\033[32m[OK] All services restarted successfully\033[0m")
	}
}

func startSingleService(name string) error {
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
	return fmt.Errorf("unknown service: %s", name)
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
		if pid, ok := servicePIDs["api"]; ok && isProcessRunning(pid) {
			s.Status = "\033[32mRUNNING\033[0m"
			s.PID = pid
		}
	case "web":
		s.DisplayName = "Nuxt Web"
		if pid, ok := servicePIDs["web"]; ok && isProcessRunning(pid) {
			s.Status = "\033[32mRUNNING\033[0m"
			s.PID = pid
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
			startAllServices()
		case "Stop All Services":
			stopAllServices()
		case "Restart All Services":
			restartAllServices()
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
			startAllServices()
		} else {
			startSingleService(service)
		}

	case "stop":
		if len(os.Args) < 3 {
			fmt.Println("Usage: appmgr stop <service|all>")
			os.Exit(1)
		}
		service := os.Args[2]
		if service == "all" {
			stopAllServices()
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
			restartAllServices()
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

	case "help", "h", "-h", "--help":
		fmt.Println("Usage: appmgr <command> [service]")
		fmt.Println()
		fmt.Println("Commands:")
		fmt.Println("  start <service|all>    Start services")
		fmt.Println("  stop <service|all>     Stop services")
		fmt.Println("  restart <service|all>  Restart services")
		fmt.Println("  status                  Show status")
		fmt.Println("  logs <service>         Show logs")
		fmt.Println("  health                  Health check")
		fmt.Println("  init-db                Initialize database")
		fmt.Println("  help                   Show this help message")
		fmt.Println()
		fmt.Println("Services: api, web, db, redis")
		return

	default:
		fmt.Println("Usage: appmgr <command> [service]")
		fmt.Println()
		fmt.Println("Commands:")
		fmt.Println("  start <service|all>    Start services")
		fmt.Println("  stop <service|all>     Stop services")
		fmt.Println("  restart <service|all>  Restart services")
		fmt.Println("  status                  Show status")
		fmt.Println("  logs <service>         Show logs")
		fmt.Println("  health                  Health check")
		fmt.Println("  init-db                Initialize database")
		fmt.Println("  help                   Show this help message")
		fmt.Println()
		fmt.Println("Services: api, web, db, redis")
		return
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