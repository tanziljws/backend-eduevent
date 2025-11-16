import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Calendar, 
  CheckCircle, 
  Award, 
  Clock,
  TrendingUp
} from 'lucide-react';

const EventStatistics = ({ statistics }) => {
  const stats = [
    {
      title: 'Total Event',
      value: statistics.total_events || 0,
      icon: <Calendar className="w-5 h-5 text-blue-400" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Event Dihadiri',
      value: statistics.attended_events || 0,
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Sertifikat Diperoleh',
      value: statistics.certificates_earned || 0,
      icon: <Award className="w-5 h-5 text-yellow-400" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Event Mendatang',
      value: statistics.upcoming_events || 0,
      icon: <Clock className="w-5 h-5 text-violet-400" />,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10'
    }
  ];

  const attendanceRate = statistics.total_events > 0 
    ? Math.round((statistics.attended_events / statistics.total_events) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Attendance Rate Card */}
      {statistics.total_events > 0 && (
        <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold text-indigo-400">{attendanceRate}%</p>
                <p className="text-xs text-gray-500">
                  {statistics.attended_events} dari {statistics.total_events} event
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-500/10">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventStatistics;
