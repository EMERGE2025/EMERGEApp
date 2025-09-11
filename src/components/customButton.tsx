interface CustomButtonProps {
  text: string;
  status: string;
  onClick?: () => void;
}

export default function CustomButton({ text, status, onClick }: CustomButtonProps) {
  return (
    <div
      className={`px-3 md:px-5 py-2 md:py-2 rounded-full flex items-center text-sm md:text-base bg-[var(--${status})] shadow bg-[var(--white-bg)] cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95`}
      onClick={onClick}
    >
      <p className="font-medium">{text}</p>
    </div>
  );
}
