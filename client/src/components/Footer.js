import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1 */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:text-white">Home</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">About</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">Support</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/faq" className="hover:text-white">FAQ</Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-white">Help Center</Link>
            </li>
            <li>
              <Link href="/feedback" className="hover:text-white">Feedback</Link>
            </li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">Legal</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-white">Cookie Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} YourApp. All rights reserved.
      </div>
    </footer>
  );
}
