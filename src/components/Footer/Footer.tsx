 import React from 'react';

const Footer = () => {
  return (
    <footer className="text-white mt-auto" style={{ backgroundColor: '#000000' }}>
      <div className="p-24">
        <div className="flex justify-between items-end">
          <p className="text-xs text-gray-300">
            Copyright © Rochester Institute of Technology. All Rights Reserved.
          </p>
          <div className="text-xs text-gray-300 text-right">
            <p>P.O. Box 341055,</p>
            <p>Dubai Silicon Oasis,</p>
            <p>Dubai, U.A.E</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

