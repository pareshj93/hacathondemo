import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Heart, BookOpen, Award, Zap, Info } from 'lucide-react';

export default function RightSidebar() {
  return (
    <div className="space-y-4 sticky top-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            About Edubridgepeople
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            A trusted community platform connecting donors and verified students to share educational resources and knowledge.
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-600">Community-driven learning</span>
            </div>
            <div className="flex items-center text-sm">
              <Award className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-gray-600">Verified student network</span>
            </div>
            <div className="flex items-center text-sm">
              <Heart className="w-4 h-4 mr-2 text-red-600" />
              <span className="text-gray-600">Supporting education equality</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Students</span>
              <Badge variant="secondary">250+</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resources Shared</span>
              <Badge variant="secondary">1,200+</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Verified Donors</span>
              <Badge variant="secondary">150+</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Stories</span>
              <Badge variant="secondary">50+</Badge>
            </div>
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> These numbers are simulated for demonstration purposes during our testing and development phase. They do not reflect actual user statistics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Built With</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Bolt.new</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-sm font-medium">Supabase</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="text-sm font-medium">Netlify</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <span className="text-sm font-medium">INOS Domain</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Built with Bolt.new</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Hackathon project showcasing AI-powered development
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}