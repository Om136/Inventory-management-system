export default function Home() {
  // Redirect at render time (server component)
  // eslint-disable-next-line @next/next/no-async-client-component
  const { redirect } = require("next/navigation");
  redirect("/dashboard");
}
