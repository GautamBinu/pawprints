'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Nav } from '..';
import { useAuth } from '@/app/auth/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="border-b h-full" style={{ backgroundColor: '#F76902' }}>
      <div className="px-18 h-full py-2">
        <div className="flex items-center justify-between h-full">
          {/* Clickable Logo */}
          <Link href="/" className="cursor-pointer ml-4">
            <Image
              src="RIT-00070A_RGB_TM.svg"
              alt="RIT Paw Logo"
              width={80}
              height={100}
              className="object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          
          <div className="flex items-center gap-6">
            <Nav />
            
            {/* User Profile Icon */}
            {user && (
              <div className="relative group mr-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
                  <div className="font-semibold">{user.displayName || 'User'}</div>
                  {user.email && (
                    <div className="text-xs text-gray-300">{user.email}</div>
                  )}
                  {/* Arrow pointer */}
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
