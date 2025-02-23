import ConnectWallet from "./components/ConnectWallet";

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to the Event Booking App</h1>
      <ConnectWallet />
    </div>
  );
}