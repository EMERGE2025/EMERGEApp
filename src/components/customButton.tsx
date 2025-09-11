interface CustomButtonProps {
  text: string;
  status: string;
  onClick?: () => void;
}

export default function CustomButton({ text, status, onClick }: CustomButtonProps) {
  return (
    <div
      className={`px-5 rounded-full flex items-center py-2 bg-[var(--${status})] shadow bg-[var(--white-bg)] cursor-pointer`}
      onClick={onClick}
    >
      <p>{text}</p>
    </div>
  );
}
