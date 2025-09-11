interface CustomButtonProps {
  text: String;
  status: String;
}

export default function CustomButton({ text, status }: CustomButtonProps) {
  return (
    <div
      className={`px-5 rounded-full flex items-center py-2 bg-[var(--${status})] shadow bg-[var(--white-bg)]`}
    >
      <p>{text}</p>
    </div>
  );
}
