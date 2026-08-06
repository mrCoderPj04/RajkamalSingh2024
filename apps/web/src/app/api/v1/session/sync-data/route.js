import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomId, newDocPost, newFile, action, postId } = body;

    let targetRoomId = roomId ? roomId.toUpperCase().trim() : null;
    let session = targetRoomId ? activeSessions.get(targetRoomId) : null;

    if (!session && roomId) {
      const pinPart = roomId.replace('SOFO-', '').trim();
      for (const [id, s] of activeSessions.entries()) {
        if (s.pin === pinPart && s.status !== 'DISCONNECTED') {
          session = s;
          break;
        }
      }
    }

    if (!session) {
      return NextResponse.json({ success: false, message: 'Room session not found for sync.' }, { status: 404 });
    }

    if (!session.docPosts) session.docPosts = [];
    if (!session.sharedFiles) session.sharedFiles = [];

    if (action === 'ADD_DOC_POST' && newDocPost) {
      if (!session.docPosts.some(p => p.id === newDocPost.id)) {
        session.docPosts.unshift(newDocPost);
      }
    } else if (action === 'DELETE_DOC_POST' && postId) {
      session.docPosts = session.docPosts.filter(p => p.id !== postId);
    } else if (action === 'ADD_FILE' && newFile) {
      if (!session.sharedFiles.some(f => f.id === newFile.id)) {
        session.sharedFiles.unshift(newFile);
      }
    }

    return NextResponse.json({
      success: true,
      docPosts: session.docPosts,
      sharedFiles: session.sharedFiles
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
