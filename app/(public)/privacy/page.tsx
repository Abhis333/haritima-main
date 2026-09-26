export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <div className="container-h max-w-3xl py-12 prose-h space-y-4">
      <h1 className="text-5xl">Privacy</h1>
      <p>Haritima stores your name, email and a hashed password if you create an account. Questions you ask Ask Haritima while signed in are saved to your conversation history; questions asked while signed out are not stored with your identity.</p>
      <p>Photos uploaded for identification are sent to the Pl@ntNet API for analysis and are not stored by Haritima. Feedback messages are visible to administrators only.</p>
      <p>Your language choice is saved in a cookie. No advertising or tracking cookies are used.</p>
    </div>
  );
}
