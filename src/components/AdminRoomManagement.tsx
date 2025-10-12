import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RoomType {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  image_url: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
}

interface AdminRoomManagementProps {
  accessToken: string;
}

export function AdminRoomManagement({ accessToken }: AdminRoomManagementProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Type form state
  const [rtName, setRtName] = useState('');
  const [rtDescription, setRtDescription] = useState('');
  const [rtPrice, setRtPrice] = useState('');
  const [rtMaxGuests, setRtMaxGuests] = useState('');
  const [rtAmenities, setRtAmenities] = useState('');
  const [rtImageUrl, setRtImageUrl] = useState('');

  // Room form state
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomStatus, setRoomStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [roomFloor, setRoomFloor] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [roomTypesRes, roomsRes] = await Promise.all([
        supabase.from('room_types').select('*').order('name'),
        supabase.from('rooms').select('*').order('room_number'),
      ]);

      if (roomTypesRes.error) throw roomTypesRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setRoomTypes(roomTypesRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      setError('Failed to load room data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const resetRoomTypeForm = () => {
    setRtName('');
    setRtDescription('');
    setRtPrice('');
    setRtMaxGuests('');
    setRtAmenities('');
    setRtImageUrl('');
    setEditingRoomType(null);
  };

  const resetRoomForm = () => {
    setRoomNumber('');
    setRoomTypeId('');
    setRoomStatus('available');
    setRoomFloor('');
    setEditingRoom(null);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setRtName(roomType.name);
    setRtDescription(roomType.description);
    setRtPrice(roomType.price_per_night.toString());
    setRtMaxGuests(roomType.max_guests.toString());
    setRtAmenities(roomType.amenities.join(', '));
    setRtImageUrl(roomType.image_url);
    setDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setRoomTypeId(room.room_type_id);
    setRoomStatus(room.status);
    setRoomFloor(room.floor.toString());
    setDialogOpen(true);
  };

  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const roomTypeData = {
        name: rtName,
        description: rtDescription,
        price_per_night: parseFloat(rtPrice),
        max_guests: parseInt(rtMaxGuests),
        amenities: rtAmenities.split(',').map(a => a.trim()).filter(a => a),
        image_url: rtImageUrl,
      };

      let result;
      if (editingRoomType) {
        result = await supabase
          .from('room_types')
          .update(roomTypeData)
          .eq('id', editingRoomType.id);
      } else {
        result = await supabase
          .from('room_types')
          .insert([roomTypeData]);
      }

      if (result.error) throw result.error;

      setDialogOpen(false);
      resetRoomTypeForm();
      await fetchData();
    } catch (err) {
      setError('Failed to save room type');
      console.error('Save error:', err);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const roomData = {
        room_number: roomNumber,
        room_type_id: roomTypeId,
        status: roomStatus,
        floor: parseInt(roomFloor),
      };

      let result;
      if (editingRoom) {
        result = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', editingRoom.id);
      } else {
        result = await supabase
          .from('rooms')
          .insert([roomData]);
      }

      if (result.error) throw result.error;

      setDialogOpen(false);
      resetRoomForm();
      await fetchData();
    } catch (err) {
      setError('Failed to save room');
      console.error('Save error:', err);
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;

    try {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
    } catch (err) {
      setError('Failed to delete room type');
      console.error('Delete error:', err);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
    } catch (err) {
      setError('Failed to delete room');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">Room Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage room types and individual rooms</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="room-types" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
          <TabsTrigger value="room-types" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
            Room Types
          </TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
            Rooms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="room-types" className="mt-6">
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <CardHeader className="relative bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Room Types</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Manage room categories and pricing</CardDescription>
                </div>
                <Dialog open={dialogOpen && !editingRoom} onOpenChange={(open: boolean) => {
                  setDialogOpen(open);
                  if (!open) resetRoomTypeForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 hover:scale-105">
                      <Plus className="w-4 h-4" />
                      Add Room Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900 dark:text-slate-100">
                        {editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}
                      </DialogTitle>
                      <DialogDescription className="text-slate-600 dark:text-slate-400">
                        Configure room type details and amenities
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoomType} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rt-name" className="text-slate-700 dark:text-slate-300">Name</Label>
                        <Input
                          id="rt-name"
                          value={rtName}
                          onChange={(e) => setRtName(e.target.value)}
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-description" className="text-slate-700 dark:text-slate-300">Description</Label>
                        <Textarea
                          id="rt-description"
                          value={rtDescription}
                          onChange={(e) => setRtDescription(e.target.value)}
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rt-price" className="text-slate-700 dark:text-slate-300">Price per Night ($)</Label>
                          <Input
                            id="rt-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={rtPrice}
                            onChange={(e) => setRtPrice(e.target.value)}
                            required
                            className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rt-max-guests" className="text-slate-700 dark:text-slate-300">Max Guests</Label>
                          <Input
                            id="rt-max-guests"
                            type="number"
                            min="1"
                            value={rtMaxGuests}
                            onChange={(e) => setRtMaxGuests(e.target.value)}
                            required
                            className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-amenities" className="text-slate-700 dark:text-slate-300">Amenities (comma-separated)</Label>
                        <Input
                          id="rt-amenities"
                          value={rtAmenities}
                          onChange={(e) => setRtAmenities(e.target.value)}
                          placeholder="WiFi, TV, Air Conditioning"
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-image" className="text-slate-700 dark:text-slate-300">Image URL</Label>
                        <Input
                          id="rt-image"
                          type="url"
                          value={rtImageUrl}
                          onChange={(e) => setRtImageUrl(e.target.value)}
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200">
                          {editingRoomType ? 'Update' : 'Create'} Room Type
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            resetRoomTypeForm();
                          }}
                          className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading room types...</p>
                </div>
              ) : roomTypes.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="w-16 h-16 text-purple-500 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg">No room types found</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Create your first room type to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-700">
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Name</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Description</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Price/Night</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Max Guests</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Amenities</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomTypes.map((roomType) => (
                        <TableRow key={roomType.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{roomType.name}</TableCell>
                          <TableCell className="max-w-xs truncate text-slate-600 dark:text-slate-400">{roomType.description}</TableCell>
                          <TableCell className="font-semibold text-green-600 dark:text-green-400">${roomType.price_per_night}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {roomType.max_guests} guest{roomType.max_guests !== 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roomType.amenities.slice(0, 3).map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                  {amenity}
                                </Badge>
                              ))}
                              {roomType.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                  +{roomType.amenities.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRoomType(roomType)}
                                className="hover:bg-purple-50 dark:hover:bg-purple-950/50 border-purple-200 dark:border-purple-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRoomType(roomType.id)}
                                className="hover:bg-red-50 dark:hover:bg-red-950/50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <CardHeader className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Rooms</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Manage individual room inventory</CardDescription>
                </div>
                <Dialog open={dialogOpen && !editingRoomType} onOpenChange={(open: boolean) => {
                  setDialogOpen(open);
                  if (!open) resetRoomForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105">
                      <Plus className="w-4 h-4" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900 dark:text-slate-100">
                        {editingRoom ? 'Edit Room' : 'Add New Room'}
                      </DialogTitle>
                      <DialogDescription className="text-slate-600 dark:text-slate-400">
                        Configure room details
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoom} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-number" className="text-slate-700 dark:text-slate-300">Room Number</Label>
                        <Input
                          id="room-number"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-type" className="text-slate-700 dark:text-slate-300">Room Type</Label>
                        <Select value={roomTypeId} onValueChange={setRoomTypeId} required>
                          <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400">
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes.map((rt) => (
                              <SelectItem key={rt.id} value={rt.id}>
                                {rt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-status" className="text-slate-700 dark:text-slate-300">Status</Label>
                        <Select value={roomStatus} onValueChange={(value: 'available' | 'occupied' | 'maintenance') => setRoomStatus(value)} required>
                          <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-floor" className="text-slate-700 dark:text-slate-300">Floor</Label>
                        <Input
                          id="room-floor"
                          type="number"
                          min="1"
                          value={roomFloor}
                          onChange={(e) => setRoomFloor(e.target.value)}
                          required
                          className="border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                          {editingRoom ? 'Update' : 'Create'} Room
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            resetRoomForm();
                          }}
                          className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg">No rooms found</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Create your first room to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-700">
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room Number</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room Type</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Floor</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => {
                        const roomType = roomTypes.find(rt => rt.id === room.room_type_id);
                        return (
                          <TableRow key={room.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="font-mono font-medium text-slate-900 dark:text-slate-100">{room.room_number}</TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{roomType?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Floor {room.floor}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  room.status === 'available'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800'
                                    : room.status === 'occupied'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                }`}
                              >
                                {room.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRoom(room)}
                                  className="hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteRoom(room.id)}
                                  className="hover:bg-red-50 dark:hover:bg-red-950/50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
