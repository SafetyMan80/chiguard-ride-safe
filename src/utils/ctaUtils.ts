export const formatArrivalTime = (arrivalTime: string) => {
  const arrTime = new Date(arrivalTime);
  const now = new Date();
  const diffMinutes = Math.round((arrTime.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffMinutes <= 1) return "Due";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  return arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getLineColor = (route: string) => {
  const colors: { [key: string]: string } = {
    'Red': 'bg-red-500',
    'Blue': 'bg-blue-500', 
    'Brown': 'bg-amber-700',
    'Green': 'bg-green-500',
    'Orange': 'bg-orange-500',
    'Pink': 'bg-pink-500',
    'Purple': 'bg-purple-500',
    'Yellow': 'bg-yellow-500',
  };
  return colors[route] || 'bg-gray-500';
};

export const getLineColors = (lines: string[]) => {
  const colorMap: { [key: string]: string } = {
    'Red': 'bg-red-500',
    'Blue': 'bg-blue-500',
    'Brown': 'bg-amber-700',
    'Green': 'bg-green-500',
    'Orange': 'bg-orange-500',
    'Pink': 'bg-pink-500',
    'Purple': 'bg-purple-500',
    'Yellow': 'bg-yellow-500',
    'Metra': 'bg-gray-600'
  };
  
  return lines.map(line => colorMap[line] || 'bg-gray-500');
};