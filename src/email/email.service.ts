import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '@nestjs/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: Mail;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'GMAIL', // TODO: config
        pass: 'PASSWORD', // TODO: config
      },
    });
  }

  public async sendVerificationMail(
    emailAddress: string,
    signupVerifyToken: string,
    uid: number,
  ) {
    const BASE_URL = 'http://localhost:3333/api/v1'; // TODO: config
    //const BASE_URL = this.configService.get('BASE_URL');
    const url = `${BASE_URL}/users/${uid}?token=${signupVerifyToken}`;

    const mailOptions: EmailOptions = {
      to: emailAddress,
      subject: '모도코 가입 인증 메일입니다.',
      html: `
        <h2>가입 인증을 위해 가입 확인 버튼를 눌러주세요.</h2>
        <form action="${url}" method="POST">
          <button>가입 확인</button>
        </form>
        <p>
          만약 버튼이 작동하지 않는다면 아래 링크를 클릭해주세요. <br />
          <a href="${url}">${url}</a>
        </p>
        <p>감사합니다.</p>
        <p>모도코 팀 드림</p>
      `,
    };

    return await this.sendEmail(mailOptions);
  }

  private sendEmail(mailOptions: EmailOptions) {
    return this.transporter.sendMail(mailOptions);
  }
}
