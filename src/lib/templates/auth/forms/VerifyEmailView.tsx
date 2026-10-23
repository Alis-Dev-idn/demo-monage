import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react';
import { Button } from '@dep/ui/button';
import { AuthFormBanner } from '../components/AuthFormBanner';
import { AuthFormFooter, AuthLink } from '../components/AuthFormFooter';
import { AuthStatusView } from '../components/AuthStatusView';
import type { AuthFormTheme, VerifyModeProps } from '../types';

interface VerifyEmailViewComponentProps extends VerifyModeProps {
  theme: AuthFormTheme;
}

export const VerifyEmailView = (p: VerifyEmailViewComponentProps) => {
  if (p.isVerifying) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="info"
        icon={<Loader2 size={32} className="animate-spin" />}
        title="Verifying..."
        description="Please wait while we verify your email."
      />
    );
  }

  if (p.isVerified) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="success"
        icon={<CheckCircle size={32} />}
        title="Email verified"
        description="Your account is now active."
      >
        <Button variant="primary" fullWidth onClick={p.onBackToLogin}>
          Sign in now
        </Button>
      </AuthStatusView>
    );
  }

  if (p.isTokenInvalid) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="error"
        icon={<XCircle size={32} />}
        title="Invalid link"
        description="This verification link is expired. Request a new one below."
      >
        <Button
          variant="outline"
          fullWidth
          onClick={() => p.onResend()}
          isLoading={p.isResending}
          loadingText="Sending..."
        >
          Resend email
        </Button>
        <AuthFormFooter theme={p.theme}>
          <AuthLink theme={p.theme} onClick={p.onBackToLogin}>
            Back to sign in
          </AuthLink>
        </AuthFormFooter>
      </AuthStatusView>
    );
  }

  return (
    <AuthStatusView
      theme={p.theme}
      iconVariant="info"
      icon={<Mail size={32} />}
      title="Check your email"
      description="We sent a verification link to:"
      email={p.email}
    >
      {p.resendSuccess && (
        <AuthFormBanner variant="success" theme={p.theme}>
          Verification email sent again.
        </AuthFormBanner>
      )}
      <Button
        variant="outline"
        fullWidth
        onClick={() => p.onResend()}
        isLoading={p.isResending}
        loadingText="Sending..."
      >
        Resend email
      </Button>
      <AuthFormFooter theme={p.theme}>
        <AuthLink theme={p.theme} onClick={p.onBackToLogin}>
          Back to sign in
        </AuthLink>
      </AuthFormFooter>
    </AuthStatusView>
  );
};
