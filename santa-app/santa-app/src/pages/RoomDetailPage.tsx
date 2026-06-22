import { useParams } from "react-router";

export function RoomDetailPage() {
  const { id } = useParams();
  return <h1 className="p-6 text-2xl font-semibold">Room Detail — {id}</h1>;
}
