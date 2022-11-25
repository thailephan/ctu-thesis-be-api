export const AccountStatuses = new Map([[1, 'active'], [2, 'blocked'], [0, 'not verified'], [-1, 'delete']]);
// In db
export const ChatRoomTypes = new Map<number, string>([[1, "friend"], [2, "group"]]);
// In db
export const MessageTypes = new Map<number, string>([[1, "text"], [2, "image"], [3, "voice"], [4, "file"]]);
export const AccountRegisterTypes = new Map([[1, 'email/password'], [2, 'google']]);

export const MessageStatus = new Map([[1, 'sent'], [2, 'received'], [3, 'seen'], [-1, 'delete']]);

export const PAGE_LIMIT = 30;

const Constants = {
    PAGE_LIMIT,
    ChatRoomTypes,
    MessageTypes,
    MessageStatus,
    AccountStatuses,
    AccountRegisterTypes
}

module.exports = Constants;