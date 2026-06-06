// import { RegisterForm } from './components/RegisterForm';
// import { LoginForm } from './components/LoginForm';
import { RoomList } from './components/RoomList/RoomList';

const DEMO_ROOMS = [
  { code: '#OFHPGT', name: 'Office Holiday Party', memberCount: 12, status: 'pending' as const },
  { code: '#FAMCKA', name: 'Family Christmas', memberCount: 8, status: 'drawn' as const },
  { code: '#DVTSDE', name: 'Dev Team Santa', memberCount: 6, status: 'closed' as const },
  { code: '#OFHPGQ', name: 'Office Holiday Party', memberCount: 12, status: 'pending' as const },
  { code: '#FAMCKW', name: 'Family Christmas', memberCount: 8, status: 'drawn' as const },
  { code: '#DVTSDV', name: 'Office Holiday Party', memberCount: 12, status: 'pending' as const },
  { code: '#FAMCKM', name: 'Family Christmas', memberCount: 8, status: 'drawn' as const },
  { code: '#DVTSDP', name: 'Dev Team Santa', memberCount: 6, status: 'closed' as const },
];

export default function App() {
  return (
    <>
      {/* <RegisterForm /> */}
      {/* <LoginForm /> */}
      <RoomList rooms={DEMO_ROOMS} />
    </>
  );
}
