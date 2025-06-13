export interface OwnerContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export async function sendSms(to: string, message: string): Promise<void> {
  console.log(`sendSms to=${to} message=${message}`);
}

export async function sendWhatsapp(to: string, message: string): Promise<void> {
  console.log(`sendWhatsapp to=${to} message=${message}`);
}

export async function makeRobocall(to: string, message: string): Promise<void> {
  console.log(`makeRobocall to=${to} message=${message}`);
}

export async function sendSnailMail(options: {
  address: string;
  subject: string;
  body: string;
  attachments: string[];
}): Promise<void> {
  console.log(`sendSnailMail to=${options.address} subject=${options.subject}`);
}
