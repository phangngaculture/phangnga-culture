import React, { useState, useRef, useEffect } from 'react';
import { BookingRequest, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  Car,
  FileCheck2,
  Clock,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit,
  Eye,
  MapPin,
  User as UserIcon,
  Gauge,
  ChevronLeft
} from 'lucide-react';
import { canUserExecuteMission } from '../utils/driverPermissions';

interface SwipeableBookingCardProps {
  booking: BookingRequest;
  currentUser: User;
  allUsers?: User[];
  onViewMemo: (booking: BookingRequest) => void;
  onDeleteBooking: (bookingId: string) => void;
  onEditBooking: (booking: BookingRequest) => void;
  onOpenDriverMissions?: (booking: BookingRequest) => void;
  onOpenSignatureModal?: (booking: BookingRequest) => void;
  onOpenDirectorApproval?: () => void;
}

export const SwipeableBookingCard: React.FC<SwipeableBookingCardProps> = ({
  booking: b,
  currentUser,
  allUsers,
  onViewMemo,
  onDeleteBooking,
  onEditBooking,
  onOpenDriverMissions,
  onOpenSignatureModal,
  onOpenDirectorApproval
}) => {
  // Swipe State
  const [offsetX, setOffsetX] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isVerticalScroll = useRef(false);
  const hasMovedSignificant = useRef(false);

  // Determine user permissions for this booking
  const isOwner = currentUser.id === b.userId || currentUser.username === b.username || currentUser.name === b.name;
  const isAdmin = currentUser.role === 'admin';
  const isDirector = currentUser.role === 'director' || isAdmin;
  const isPending = b.status === 'pending' || b.status === 'pending_director';
  const canDelete = isAdmin || (isOwner && (isPending || b.status === 'rejected' || b.status === 'cancelled'));
  const canEdit = isAdmin || (isOwner && isPending);

  // Maximum swipe reveal width
  // If can delete: show both View Memo (76px) + Delete (76px) = 152px
  // If cannot delete: show View Memo (86px)
  const buttonWidth = 76;
  const maxDistance = canDelete ? buttonWidth * 2 : 86;

  let statusBadge = {
    text: 'รออนุมัติ',
    class: 'bg-amber-100 text-amber-800 border-amber-300'
  };
  if (b.status === 'approved') {
    statusBadge = {
      text: 'อนุมัติแล้ว',
      class: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  } else if (b.status === 'in_progress') {
    statusBadge = {
      text: 'กำลังเดินทาง',
      class: 'bg-orange-100 text-orange-800 border-orange-300'
    };
  } else if (b.status === 'completed') {
    statusBadge = {
      text: 'เสร็จสิ้นภารกิจ',
      class: 'bg-teal-100 text-teal-800 border-teal-300'
    };
  } else if (b.status === 'rejected') {
    statusBadge = {
      text: 'ไม่อนุมัติ/ส่งกลับ',
      class: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isVerticalScroll.current = false;
    hasMovedSignificant.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentClientX = e.touches[0].clientX;
    const currentClientY = e.touches[0].clientY;
    const diffX = currentClientX - startX.current;
    const diffY = currentClientY - startY.current;

    // Detect if vertical scroll is dominant early
    if (!isVerticalScroll.current && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
      isVerticalScroll.current = true;
      isDragging.current = false;
      setIsSwiping(false);
      return;
    }

    if (isVerticalScroll.current) return;

    if (Math.abs(diffX) > 6) {
      hasMovedSignificant.current = true;
      // Prevent default page scroll if swiping horizontally
      if (e.cancelable) {
        e.preventDefault();
      }

      let newOffset = isOpened ? -maxDistance + diffX : diffX;

      // Restrict boundaries
      if (newOffset > 10) {
        // slight rubberband right
        newOffset = 10 * 0.2;
      } else if (newOffset < -maxDistance - 40) {
        // rubberband left
        const over = -newOffset - maxDistance;
        newOffset = -maxDistance - over * 0.2;
      }

      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || isVerticalScroll.current) {
      isDragging.current = false;
      setIsSwiping(false);
      return;
    }
    isDragging.current = false;
    setIsSwiping(false);

    // If swiped far enough left, snap open
    const threshold = Math.min(48, maxDistance * 0.35);
    if (offsetX < -threshold) {
      setOffsetX(-maxDistance);
      setIsOpened(true);
    } else {
      setOffsetX(0);
      setIsOpened(false);
    }
  };

  // Mouse drag simulation (for testing in desktop browser or responsive mode)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only respond to main left click
    if (e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
    isVerticalScroll.current = false;
    hasMovedSignificant.current = false;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diffX = e.clientX - startX.current;
    const diffY = e.clientY - startY.current;

    if (!isVerticalScroll.current && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      isVerticalScroll.current = true;
      isDragging.current = false;
      setIsSwiping(false);
      return;
    }

    if (isVerticalScroll.current) return;

    if (Math.abs(diffX) > 6) {
      hasMovedSignificant.current = true;
      let newOffset = isOpened ? -maxDistance + diffX : diffX;
      if (newOffset > 10) {
        newOffset = 10 * 0.2;
      } else if (newOffset < -maxDistance - 40) {
        const over = -newOffset - maxDistance;
        newOffset = -maxDistance - over * 0.2;
      }
      setOffsetX(newOffset);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwiping(false);

    const threshold = Math.min(48, maxDistance * 0.35);
    if (offsetX < -threshold) {
      setOffsetX(-maxDistance);
      setIsOpened(true);
    } else {
      setOffsetX(0);
      setIsOpened(false);
    }
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsOpened(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 w-full shadow-2xs group select-none"
      id={`swipe-booking-${b.id}`}
      onMouseLeave={() => {
        if (isDragging.current) {
          handleMouseUp();
        }
      }}
    >
      {/* Background Revealed Actions (Z-0) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex z-0 h-full select-none"
        style={{ width: `${maxDistance}px` }}
      >
        {/* View Memo Quick Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewMemo(b);
            closeSwipe();
          }}
          className="h-full flex-1 bg-gradient-to-b from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all px-2 text-center"
          title="ดูใบคำขอ"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-bold leading-tight">ดูใบคำขอ</span>
        </button>

        {/* Delete Quick Action */}
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`ยืนยันการลบใบคำขอใช้รถยนต์เลขที่ ${b.id}?`)) {
                onDeleteBooking(b.id);
              }
              closeSwipe();
            }}
            className="h-full flex-1 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all px-2 text-center border-l border-white/10"
            title="ลบคำขอ"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold leading-tight">ลบคำขอ</span>
          </button>
        )}
      </div>

      {/* Foreground Swipeable Card Content (Z-10) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          // If swiped opened, tapping card closes it
          if (isOpened) {
            e.stopPropagation();
            closeSwipe();
          } else if (!hasMovedSignificant.current) {
            // Normal tap opens memo
            onViewMemo(b);
          }
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          touchAction: 'pan-y'
        }}
        className={`relative z-10 w-full p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer border-r border-slate-100 dark:border-slate-800 ${
          isSwiping ? '' : 'transition-transform duration-250 ease-out'
        }`}
      >
        <div className="space-y-1.5 max-w-2xl w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800">
              {b.id}
            </span>
            {b.memoNo && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                เลขที่บันทึก: {b.memoNo}
              </span>
            )}
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.class}`}>
              {statusBadge.text}
            </span>

            {/* Mobile swipe left indicator */}
            <div className="inline-flex sm:hidden items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-auto select-none bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              <ChevronLeft className="w-3 h-3 text-orange-500 animate-pulse" />
              <span>ปัดซ้ายด่วน</span>
            </div>
          </div>

          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 transition leading-snug">
            {b.purpose}
          </h4>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{b.name} ({b.department})</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{b.destination}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              <span>{b.carName}</span>
            </span>
            <span className="flex items-center space-x-1 text-orange-700 dark:text-orange-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>เดินทาง: {formatThaiDate(b.date)} ({b.startTime} - {b.endTime} น.)</span>
            </span>
          </div>
        </div>

        {/* Desktop / Non-swiped direct buttons */}
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewMemo(b);
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-semibold transition shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
            title="ดูและพิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง"
          >
            <Eye className="w-3.5 h-3.5 text-orange-600" />
            <span>ดูใบคำขอ</span>
          </button>

          {onOpenDriverMissions &&
            (b.status === 'approved' || b.status === 'in_progress') &&
            canUserExecuteMission(b, currentUser, allUsers) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDriverMissions(b);
                }}
                className={`flex-1 sm:flex-none px-3.5 py-2 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                  b.status === 'in_progress'
                    ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{b.status === 'in_progress' ? 'กรอกไมล์กลับ' : 'เริ่มงาน (ไมล์ไป)'}</span>
              </button>
          )}

          {isDirector && isPending && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSignatureModal) {
                  onOpenSignatureModal(b);
                } else if (onOpenDirectorApproval) {
                  onOpenDirectorApproval();
                }
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>ลงนามอนุมัติ</span>
            </button>
          )}

          {(canEdit || canDelete) && (
            <div className="flex items-center space-x-1.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBooking(b);
                  }}
                  className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl text-xs font-medium transition cursor-pointer"
                  title="แก้ไขใบเบิก"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBooking(b.id);
                  }}
                  className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-medium transition cursor-pointer"
                  title="ลบคำขอ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
