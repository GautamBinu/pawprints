import React from 'react';

const Nav = () => {
  return (
    <nav className="flex items-center mr-4">
      <button className="px-6 py-3 text-black text-lg font-thin hover:text-white hover:bg-orange-600 rounded-md transition-all duration-200 group">
        <span className="group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
          About
        </span>
      </button>
    </nav>
  );
};

export default Nav;
