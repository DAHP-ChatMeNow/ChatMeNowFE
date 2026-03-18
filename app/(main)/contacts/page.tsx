"use client";

import { UserPlus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useContacts, useFriendRequests } from "@/hooks/use-contact";
import { useState } from "react";
import { FriendRequestsList } from "@/components/contact/friend-requests-list";
import { SearchAndAddFriend } from "@/components/contact/search-and-add-friend";
import { FriendsList } from "@/components/contact/friends-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ContactsPage() {
  const { data: contactsData, isLoading: isLoadingContacts } = useContacts();
  const { data: friendRequestsData, isLoading: isLoadingRequests } = useFriendRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequests, setShowRequests] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [hideRequestBanner, setHideRequestBanner] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");

  const contacts = contactsData?.contacts || [];
  const friendRequests = friendRequestsData?.requests || [];
  const filteredContactsCount = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  ).length;

  const tabs = [
    { key: "friends", label: "Bạn bè", enabled: true },
    { key: "following", label: "Đang theo dõi", enabled: false },
    { key: "suggested", label: "Gợi ý", enabled: false },
    { key: "mutual", label: "Điểm chung", enabled: false },
  ] as const;

  const requestBanner = !hideRequestBanner && (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <UserPlus className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight text-slate-900">
            {friendRequests.length > 0
              ? `Bạn có ${friendRequests.length} lời mời kết bạn đang chờ phản hồi.`
              : "Hiện chưa có lời mời kết bạn mới."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHideRequestBanner(true)}
          className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3">
        <Button
          onClick={() => setShowRequests(true)}
          className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-700"
        >
          Xem lời mời
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="hidden h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/95 px-6 backdrop-blur-sm md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-blue-600">Bạn bè</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {filteredContactsCount}/{contacts.length} bạn
          </p>
        </div>
        <button
          aria-label="Thêm bạn"
          onClick={() => setShowSearchDialog(true)}
          className="flex items-center justify-center w-10 h-10 transition-colors rounded-xl bg-slate-100/80 hover:bg-slate-200/80"
        >
          <UserPlus className="w-5 h-5 text-slate-700" />
        </button>
      </header>

      <ScrollArea className="flex-1 w-full bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-4 p-3 pb-6 md:space-y-5 md:p-6">
          <div className="flex items-center justify-between px-1 pt-1 md:hidden">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-blue-600">Bạn bè</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredContactsCount}/{contacts.length} bạn
              </p>
            </div>
            <button
              aria-label="Thêm bạn"
              onClick={() => setShowSearchDialog(true)}
              className="flex items-center justify-center w-10 h-10 transition-colors rounded-xl bg-slate-100/80 hover:bg-slate-200/80"
            >
              <UserPlus className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 md:p-4">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    disabled={!tab.enabled}
                    onClick={() => tab.enabled && setActiveTab(tab.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } ${tab.enabled ? "" : "cursor-not-allowed opacity-80"}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
              </div>
            </div>

            <div className="relative mt-3">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3.5 top-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm bạn bè"
                className="pl-10 pr-10 bg-white border shadow-sm border-slate-200/80 h-11 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => setSearchQuery("")}
                  className="absolute p-1 -translate-y-1/2 rounded-full right-2 top-1/2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="lg:hidden">
            {requestBanner}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-xl border border-slate-200/80 bg-white p-2 sm:p-3">
              <div id="friends-section" className="space-y-2">
                <div className="px-1 py-1">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Danh sách bạn bè
                  </h2>
                </div>
                <FriendsList
                  friends={contacts}
                  isLoading={isLoadingContacts}
                  searchQuery={searchQuery}
                />
              </div>
            </div>

            <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
              <div className="hidden lg:block">{requestBanner}</div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">Tổng quan</p>
                <p className="mt-2 text-sm text-slate-600">
                  Bạn đang có <span className="font-semibold text-slate-900">{contacts.length}</span> bạn
                  và <span className="font-semibold text-blue-600"> {friendRequests.length}</span> lời
                  mời chờ phản hồi.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 h-9 w-full rounded-lg border-slate-200 text-sm"
                  onClick={() => setShowSearchDialog(true)}
                >
                  Thêm bạn mới
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl gap-0 overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b border-slate-200 px-4 py-3 sm:px-5">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Lời mời kết bạn ({friendRequests.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70dvh] px-4 pb-4 pt-4 sm:px-5">
            <FriendRequestsList
              requests={friendRequests}
              isLoading={isLoadingRequests}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <SearchAndAddFriend
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
      />
    </div>
  );
}
