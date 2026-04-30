import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.NEXTAUTH_AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.NEXTAUTH_AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.NEXTAUTH_AZURE_AD_TENANT_ID || 'common',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
