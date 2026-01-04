"use client"

import { UserPlus, Users2, Bookmark, Search, Loader, MessageCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useContacts, useFriendRequests, useSendFriendRequest, useRemoveFriend } from "@/hooks/use-contact";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FriendRequestsList } from "@/components/contact/friend-requests-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ContactsPage() {
  const router = useRouter();
  const { data: contactsData, isLoading: isLoadingContacts } = useContacts();
  const { data: friendRequestsData, isLoading: isLoadingRequests } = useFriendRequests();
  const { mutate: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();
  const { mutate: removeFriend } = useRemoveFriend();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const contacts = contactsData?.contacts || [];
  const friendRequests = friendRequestsData?.requests || [];

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white w-full">
      <header className="h-[60px] md:h-[70px] border-b border-slate-100 flex items-center px-4 md:px-6 sticky top-0 bg-white z-10 shrink-0">
        <h1 className="text-lg md:text-xl font-bold">Danh bạ</h1>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="w-full p-4 md:p-8 space-y-8">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 font-sans">
            <div
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
              onClick={() => setShowRequests(true)}
            >
              <div className="p-3 rounded-lg bg-orange-50 text-orange-500">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Lời mời kết bạn</p>
                <p className="text-xs text-slate-400">{friendRequests.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-500">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Danh sách bạn bè</p>
                <p className="text-xs text-slate-400">{contacts.length} bạn</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="p-3 rounded-lg bg-purple-50 text-purple-500">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Yêu thích</p>
                <p className="text-xs text-slate-400">0 bạn</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm bạn bè..."
                className="pl-9 bg-slate-100/50 border-none h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">
              Bạn bè ({filteredContacts.length})
            </h3>
            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredContacts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <Avatar className="h-10 w-10">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-slate-100 font-bold">
                            {contact.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => router.push(`/messages/${contact.id}`)}
                        >
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600"
                          onClick={() => removeFriend(contact.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-slate-900">{contact.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {contact.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Không tìm thấy bạn bè nào
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Friend Requests Modal */}
      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lời mời kết bạn ({friendRequests.length})</DialogTitle>
          </DialogHeader>
          <FriendRequestsList requests={friendRequests} isLoading={isLoadingRequests} />
        </DialogContent>
      </Dialog>
    </div>
  );
}