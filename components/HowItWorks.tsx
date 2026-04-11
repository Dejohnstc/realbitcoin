export default function HowItWorks() {
  return (
    <section className="py-16 px-4 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-10">
        How It Works
      </h2>

      <div className="grid gap-6 md:grid-cols-4 max-w-6xl mx-auto">
        {["Register", "Deposit", "Earn", "Withdraw"].map((step, i) => (
          <div key={i}>
            <h3 className="font-bold mb-2">{i + 1}. {step}</h3>
            <p className="text-gray-400 text-sm">
              Simple and secure process
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}