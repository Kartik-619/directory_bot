// components/Navbar.tsx
import Link from "next/link";

const Navdata = [
  { label: "Home", path: "/home" },
  { label: "About Us", path: "/about" },
  { label: "Contact Us", path: "/contact" },
];

export default function Navbar() {
  return (
    <header className="w-full">
      <nav className="fixed top-0 left-0 z-50 w-full h-16 bg-slate-700 flex items-center justify-center px-5 shadow-md">
        <ul className="flex space-x-6 text-white text-lg font-medium">
          {Navdata.map(({ label, path }) => (
            <li key={path}>
              <Link href={path}>{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
