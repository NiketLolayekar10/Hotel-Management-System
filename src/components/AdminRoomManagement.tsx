import { useState, useEffect } from 'react';
import info, { projectId } from '../utils/supabase/info';
import type { RoomType, Room } from '../utils/supabase/client';
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
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/room-types`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/rooms`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!roomTypesRes.ok || !roomsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [roomTypesData, roomsData] = await Promise.all([
        roomTypesRes.json(),
        roomsRes.json(),
      ]);

      setRoomTypes(roomTypesData);
      setRooms(roomsData);
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

      const url = editingRoomType
        ? `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/room-types/${editingRoomType.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/room-types`;

      const response = await fetch(url, {
        method: editingRoomType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roomTypeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save room type');
      }

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

      const url = editingRoom
        ? `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/rooms/${editingRoom.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/rooms`;

      const response = await fetch(url, {
        method: editingRoom ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error('Failed to save room');
      }

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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/room-types/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete room type');
      }

      await fetchData();
    } catch (err) {
      setError('Failed to delete room type');
      console.error('Delete error:', err);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/rooms/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

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
          <h2 className="text-2xl mb-2">Room Management</h2>
          <p className="text-gray-600">Manage room types and individual rooms</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="room-types">
        <TabsList>
          <TabsTrigger value="room-types">Room Types</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="room-types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Room Types</CardTitle>
                  <CardDescription>Manage room categories and pricing</CardDescription>
                </div>
                <Dialog open={dialogOpen && !editingRoom} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetRoomTypeForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Room Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure room type details and amenities
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoomType} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rt-name">Name</Label>
                        <Input
                          id="rt-name"
                          value={rtName}
                          onChange={(e) => setRtName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-description">Description</Label>
                        <Textarea
                          id="rt-description"
                          value={rtDescription}
                          onChange={(e) => setRtDescription(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rt-price">Price per Night ($)</Label>
                          <Input
                            id="rt-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={rtPrice}
                            onChange={(e) => setRtPrice(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rt-max-guests">Max Guests</Label>
                          <Input
                            id="rt-max-guests"
                            type="number"
                            min="1"
                            value={rtMaxGuests}
                            onChange={(e) => setRtMaxGuests(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-amenities">Amenities (comma-separated)</Label>
                        <Input
                          id="rt-amenities"
                          value={rtAmenities}
                          onChange={(e) => setRtAmenities(e.target.value)}
                          placeholder="WiFi, TV, Air Conditioning"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rt-image">Image URL</Label>
                        <Input
                          id="rt-image"
                          type="url"
                          value={rtImageUrl}
                          onChange={(e) => setRtImageUrl(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {editingRoomType ? 'Update' : 'Create'} Room Type
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            resetRoomTypeForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading...</p>
              ) : roomTypes.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No room types found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price/Night</TableHead>
                        <TableHead>Max Guests</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomTypes.map((roomType) => (
                        <TableRow key={roomType.id}>
                          <TableCell>{roomType.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{roomType.description}</TableCell>
                          <TableCell>${roomType.price_per_night}</TableCell>
                          <TableCell>{roomType.max_guests}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roomType.amenities.slice(0, 3).map((amenity) => (
                                <Badge key={amenity} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {roomType.amenities.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
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
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRoomType(roomType.id)}
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

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rooms</CardTitle>
                  <CardDescription>Manage individual room inventory</CardDescription>
                </div>
                <Dialog open={dialogOpen && !editingRoomType} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetRoomForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingRoom ? 'Edit Room' : 'Add New Room'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure room details
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoom} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-number">Room Number</Label>
                        <Input
                          id="room-number"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-type">Room Type</Label>
                        <Select value={roomTypeId} onValueChange={setRoomTypeId} required>
                          <SelectTrigger>
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
                        <Label htmlFor="room-status">Status</Label>
                        <Select value={roomStatus} onValueChange={(value: any) => setRoomStatus(value)} required>
                          <SelectTrigger>
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
                        <Label htmlFor="room-floor">Floor</Label>
                        <Input
                          id="room-floor"
                          type="number"
                          min="1"
                          value={roomFloor}
                          onChange={(e) => setRoomFloor(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {editingRoom ? 'Update' : 'Create'} Room
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            resetRoomForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading...</p>
              ) : rooms.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No rooms found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room Number</TableHead>
                        <TableHead>Room Type</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => {
                        const roomType = roomTypes.find(rt => rt.id === room.room_type_id);
                        return (
                          <TableRow key={room.id}>
                            <TableCell>{room.room_number}</TableCell>
                            <TableCell>{roomType?.name || 'Unknown'}</TableCell>
                            <TableCell>{room.floor}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  room.status === 'available'
                                    ? 'bg-green-500'
                                    : room.status === 'occupied'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                                }
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
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteRoom(room.id)}
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
