import CircularProgress from "@mui/material/CircularProgress";

export default function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <CircularProgress />
    </div>
  );
}
