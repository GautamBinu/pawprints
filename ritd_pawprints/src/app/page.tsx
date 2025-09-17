import { SearchBar, PetitionGrid } from "@/components";

const samplePetitions = [
  {
    id: '1',
    title: 'Move Door Locks On High-Rise Res Halls Inside',
    currentSignatures: 10,
    targetSignatures: 200,
    category: 'Housing',
    status: 'active' as const
  },
  {
    id: '2',
    title: 'Petition For Air Conditioning In Mark Ellingson Hall During April And May',
    currentSignatures: 143,
    targetSignatures: 200,
    category: 'Housing',
    status: 'active' as const
  },
  {
    id: '3',
    title: '175 Jefferson Meals',
    currentSignatures: 71,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const
  },
  {
    id: '4',
    title: 'Bring Water Cups Back To Cantina',
    currentSignatures: 156,
    targetSignatures: 200,
    category: 'Dining',
    status: 'active' as const
  },
  {
    id: '5',
    title: 'Put Trash Cans In All The Classrooms',
    currentSignatures: 10,
    targetSignatures: 200,
    category: 'Facilities',
    status: 'active' as const
  },
  {
    id: '6',
    title: 'More Feminine Products In Women\'s Bathrooms',
    currentSignatures: 19,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const
  },
  {
    id: '7',
    title: 'More Outdoor Seating For Accessibility',
    currentSignatures: 42,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const
  },
  {
    id: '8',
    title: 'The Double Standard Of Lowering The US Flag On The RIT Campus',
    currentSignatures: 220,
    targetSignatures: 220,
    category: 'Governance',
    status: 'threshold_met' as const
  },
  {
    id: '9',
    title: 'Swing Set For Tall People',
    currentSignatures: 31,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const
  }
];

export default function Home() {
  return (
    <div className="w-full flex flex-col px-4 sm:px-8 lg:px-20 py-10" style={{ backgroundColor: '#FFFFFF' }}>
      <SearchBar />
      <div className="flex flex-col mt-8 w-full">
        <PetitionGrid petitions={samplePetitions} />
      </div>
    </div>
  );
}
