import React from 'react';
import Image from 'next/image';
import { Nav } from './';

const Header = () => {
  return (
    <header className="border-b h-full" style={{ backgroundColor: '#F76902' }}>
      <div className="px-18 h-full">
        <div className="flex items-center justify-between h-full">
          <Image
            src="RIT-00070A_RGB_TM.svg"
            alt="RIT Paw Logo"
            width={60}
            height={80}
            className="object-contain ml-4"
          />
          
          <Nav />
        </div>
      </div>
    </header>
  );
};

export default Header;
