import { redirect } from 'next/navigation'

// The simulator is now the real merchant app.
// Any legacy link to /simulator is forwarded to the merchant login.
export default function SimulatorPage() {
  redirect('/merchant')
}
