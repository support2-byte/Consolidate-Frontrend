import { useAuth } from "../context/AuthContext";
import SessionExpiredDialog from "./SessionExpiredDialog";

export default function SessionExpiredGate() {
  const { sessionExpired, user, reauthenticate, abandonSession } = useAuth();

  return (
    <SessionExpiredDialog
      open={sessionExpired && !!user}
      email={user?.email}
      onSubmit={reauthenticate}
      onSignInAsAnother={abandonSession}
    />
  );
}
