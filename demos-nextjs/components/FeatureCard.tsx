interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-xl hover:scale-105">
      {icon && (
        <div className="mb-4 text-blue-400 text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2 text-white">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">
        {description}
      </p>
    </div>
  );
}

