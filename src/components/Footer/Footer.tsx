import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-600 mt-24 border-t border-gray-200">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} RIT Dubai Student Government
            </p>
            <div className="flex gap-4 text-xs">
              <Link href="/" className="hover:text-[#F76902] transition-colors">
                Browse
              </Link>
              <Link
                href="/create"
                className="hover:text-[#F76902] transition-colors"
              >
                Create
              </Link>
            </div>
          </div>

          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="#" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-gray-700 transition-colors">
              Security
            </Link>
            <span className="md:block hidden">•</span>
            <Link
              href="https://www.rit.edu/dubai/student-leadership"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F76902] transition-colors"
            >
              Student Government
            </Link>
            <Link
              href="https://www.rit.edu/dubai/about-rit-dubai/policies-and-procedures"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F76902] transition-colors"
            >
              SG Bylaws
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
