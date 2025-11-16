import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  async hashString(str: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    str = await bcrypt.hash(str, salt);
    return str;
  }

  async compareWithHash(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(data, encrypted);
    return isMatch;
  }
}
