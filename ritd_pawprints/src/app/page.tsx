import Image from "next/image";
import { SearchBar } from "@/components";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col px-20 py-10" style={{ backgroundColor: '#FFFFFF' }}>
      <SearchBar />
      <div className="flex-1 flex items-center justify-center px-4">
        {/* Main content area */}
      </div>
    </div>
  );
}
