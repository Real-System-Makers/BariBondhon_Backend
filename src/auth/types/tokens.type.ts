export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export enum TokenExpiration {
  ACCESS = '7d',
  REFRESH = '30d',
}

export enum TokenSecret {
  ACCESS = 'AT_SECRET_KEY',
  REFRESH = 'RT_SECRET_KEY',
}
