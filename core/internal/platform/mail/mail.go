package mail

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/smtp"
	"strings"

	"github.com/CyaniAgent/Asagity/core/internal/platform/config"
)

const (
	VerificationCodeLength = 6
	VerificationCodeExpiry = 15 * 60
)

type Service struct {
	cfg config.Config
}

func New(cfg config.Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) GenerateVerificationCode() (string, error) {
	bytes := make([]byte, VerificationCodeLength/2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *Service) SendVerificationEmail(toEmail, code, purpose string) error {
	subject := s.getSubject(purpose)
	body := s.getEmailBody(code, purpose)

	return s.sendEmail(toEmail, subject, body)
}

func (s *Service) getSubject(purpose string) string {
	switch purpose {
	case "register_with_email":
		return "【Asagity】注册验证码"
	case "login_new_device":
		return "【Asagity】登录验证码"
	default:
		return "【Asagity】验证码"
	}
}

func (s *Service) getEmailBody(code, purpose string) string {
	var purposeText string
	switch purpose {
	case "register_with_email":
		purposeText = "注册"
	case "login_new_device":
		purposeText = "登录"
	default:
		purposeText = "验证"
	}

	return fmt.Sprintf(`亲爱的用户：

您好！

您正在进行 %s 操作，您的验证码是：%s

该验证码 15 分钟内有效，请尽快完成验证。

如果这不是您的操作，请忽略此邮件。

---
Asagity (アサギティ)
The Cyan-tinted Decentralized Social Universe
`, purposeText, code)
}

func (s *Service) sendEmail(to, subject, body string) error {
	from := s.cfg.MailFrom
	fromName := s.cfg.MailFromName

	auth := smtp.PlainAuth("", s.cfg.MailSMTPUser, s.cfg.MailSMTPPassword, s.cfg.MailSMTPHost)

	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", fromName, from)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=UTF-8"

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	addr := fmt.Sprintf("%s:%s", s.cfg.MailSMTPHost, s.cfg.MailSMTPPort)

	return smtp.SendMail(addr, auth, from, []string{to}, []byte(message))
}

func (s *Service) IsEnabled() bool {
	return s.cfg.MailSMTPUser != "" && s.cfg.MailSMTPPassword != ""
}

func (s *Service) GetConfig() config.Config {
	return s.cfg
}

func NormalizeEmail(email string) string {
	return strings.TrimSpace(strings.ToLower(email))
}
