type SpeakerIconProps = {
  className?: string;
};

function SpeakerIcon({ className }: SpeakerIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 9.5h3.2L12 6.4v11.2l-3.8-3.1H5zM15.2 8.3a5.2 5.2 0 0 1 0 7.4M17.7 5.9a8.5 8.5 0 0 1 0 12.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SpeakerIcon;
