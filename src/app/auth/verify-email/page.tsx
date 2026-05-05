import { verifyEmailToken } from "@/actions/auth";
import { VerifyEmailClient } from "./VerifyEmailClient";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params?.token || "";
  const email = params?.email || "";

  if (token && email) {
    const result = await verifyEmailToken(token, email);
    return <VerifyEmailClient email={email} verified={Boolean(result.success)} error={result.error} />;
  }

  return <VerifyEmailClient email={email} />;
}
