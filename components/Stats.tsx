export default function Stats() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 pb-16 text-center">
      <div>
        <h3 className="text-xl md:text-2xl font-bold">$2.4M+</h3>
        <p className="text-gray-400 text-sm">Total Invested</p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-bold">12,540+</h3>
        <p className="text-gray-400 text-sm">Users</p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-bold">$1.8M+</h3>
        <p className="text-gray-400 text-sm">Total Paid</p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-bold">5 Years</h3>
        <p className="text-gray-400 text-sm">Experience</p>
      </div>
    </section>
  );
}