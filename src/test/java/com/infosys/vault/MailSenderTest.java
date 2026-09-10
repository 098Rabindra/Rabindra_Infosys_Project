package com.infosys.vault;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.internet.MimeMessage;

@SpringBootTest
public class MailSenderTest {

    @Autowired
    private JavaMailSender mailSender;

    @Test
    @Disabled("Manual mail test")
    public void testSendMail() throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom("drajapreinsta@gmail.com", "Password Vault Security");
        helper.setTo("dakuarabindra2001@gmail.com");
        helper.setSubject("Test OTP Mail");
        helper.setText("<h1>Your test OTP is: 123456</h1>", true);
        mailSender.send(message);
        System.out.println("TEST MAIL SENT SUCCESSFULLY!");
    }
}
