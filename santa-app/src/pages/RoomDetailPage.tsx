import { useParams } from "react-router";

export default function RoomDetailPage() {
  const { id } = useParams();
  return <h1>Room {id}</h1>;
}
