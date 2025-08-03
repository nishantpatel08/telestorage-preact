# TgStorage API Documentation

## Overview
This document provides comprehensive documentation for the TgStorage API, which is built on top of the Telegram MTProto protocol. The API is implemented as a Web Worker to handle asynchronous operations efficiently.

## Authentication APIs

### Get Country
```typescript
getCountry(): Promise<Country>
```
Returns the user's country information.

**Response:**
```typescript
{
  country: string
}
```

### Get Countries
```typescript
getCountries(lang: string): Promise<Countries>
```
Returns list of countries with their phone codes.

**Parameters:**
- `lang`: Language code for country names

**Response:**
```typescript
{
  countries: {
    name?: string
    default_name: string
    hidden: boolean
    iso2: string
    country_codes: {
      country_code: string
      prefixes?: string[]
      patterns?: string[]
    }[]
  }[]
}
```

### Send Code
```typescript
sendCode(phone: string, country: string): Promise<{
  phone_code_hash: string
  timeout: number
  type: { _: string }
  next_type?: { _: string }
}>
```
Sends verification code to the specified phone number.

**Parameters:**
- `phone`: Phone number
- `country`: Country code

### Resend Code
```typescript
resendCode(phone: string, phoneCodeHash: string): Promise<{
  phone_code_hash: string
  timeout: number
  type: { _: string }
  next_type?: { _: string }
}>
```
Resends verification code.

**Parameters:**
- `phone`: Phone number
- `phoneCodeHash`: Hash received from previous sendCode call

### Sign In
```typescript
signIn(phone: string, code: string, phoneCodeHash: string, country: string): Promise<{
  user?: User
  terms_of_service?: any
}>
```
Authenticates user with phone number and verification code.

**Parameters:**
- `phone`: Phone number
- `code`: Verification code
- `phoneCodeHash`: Hash from sendCode
- `country`: Country code

### Check Password
```typescript
checkPassword(password: string, country: string): Promise<{
  user: User
  terms_of_service?: any
}>
```
Authenticates user with password (2FA).

**Parameters:**
- `password`: User's password
- `country`: Country code

### Log Out
```typescript
logOut(): Promise<boolean>
```
Logs out the current user.

## User Management

### Update User
```typescript
updateUser(): Promise<{
  user: User
}>
```
Updates and returns current user information.

## Folder Management

### Get Folders
```typescript
getFolders(): Promise<Updates>
```
Returns all folders.

### Create Folder
```typescript
createFolder(name: string): Promise<Updates>
```
Creates a new folder.

**Parameters:**
- `name`: Folder name

### Edit Folder
```typescript
editFolder(name: string, folder: Folder): Promise<Updates>
```
Edits an existing folder.

**Parameters:**
- `name`: New folder name
- `folder`: Folder object to edit

### Edit Group
```typescript
editGroup(newGroup: string, group: string, category: string): Promise<Updates>
```
Edits a group within a category.

**Parameters:**
- `newGroup`: New group name
- `group`: Current group name
- `category`: Category name

### Edit Category
```typescript
editCategory(newCategory: string, category: string): Promise<Updates>
```
Edits a category.

**Parameters:**
- `newCategory`: New category name
- `category`: Current category name

### Delete Folder
```typescript
deleteFolder(folder: Folder): Promise<Updates>
```
Deletes a folder.

**Parameters:**
- `folder`: Folder to delete

## Message Management

### Get Messages
```typescript
getMessages(folder: Folder, lastMessageId?: number): Promise<Updates>
```
Retrieves messages from a folder.

**Parameters:**
- `folder`: Folder to get messages from
- `lastMessageId`: Optional ID of the last message for pagination

### Get Sponsored Message
```typescript
getSponsoredMessage(folder: Folder): Promise<SponsoredMessage>
```
Gets sponsored message for a folder.

**Parameters:**
- `folder`: Target folder

### Mark Sponsored Message
```typescript
markSponsoredMessage(message: SponsoredMessage, folder: Folder): Promise<void>
```
Marks a sponsored message as viewed.

**Parameters:**
- `message`: Sponsored message
- `folder`: Target folder

### Refresh Messages
```typescript
refreshMessages(folder: Folder, ids: number[]): Promise<Updates>
```
Refreshes specific messages in a folder.

**Parameters:**
- `folder`: Target folder
- `ids`: Array of message IDs to refresh

### Create Message
```typescript
createMessage(message: InputMessage, folder: Folder): Promise<Updates>
```
Creates a new message in a folder.

**Parameters:**
- `message`: Message content
- `folder`: Target folder

### Edit Message
```typescript
editMessage(message: InputMessage, folder: Folder): Promise<Updates>
```
Edits an existing message.

**Parameters:**
- `message`: Updated message content
- `folder`: Target folder

### Delete Message
```typescript
deleteMessage(message: {
  id: number
  mediaMessages?: { id: number }[]
}, folder: Folder): Promise<Updates>
```
Deletes a message and its associated media.

**Parameters:**
- `message`: Message to delete
- `folder`: Target folder

### Move Message
```typescript
moveMessage(message: Message, fromFolder: Folder, toFolder: Folder): Promise<Updates>
```
Moves a message between folders.

**Parameters:**
- `message`: Message to move
- `fromFolder`: Source folder
- `toFolder`: Destination folder

## File Management

### Prepare Uploading File
```typescript
prepareUploadingFile(fileMeta: {
  size: number
  name: string
  type: string
}): Promise<{
  fileId: string
  fileName: string
  fileType: string
  isLarge: boolean
  partSize: number
  lastPartSize: number
  partsCount: number
}>
```
Prepares a file for upload.

**Parameters:**
- `fileMeta`: File metadata

### Upload File Part
```typescript
uploadFilePart(filePartBytes: ArrayBuffer, fileParams: {
  fileId: string
  isLarge: boolean
  part: number
  partsCount: number
  thread: number
}): Promise<boolean>
```
Uploads a part of a file.

**Parameters:**
- `filePartBytes`: File part data
- `fileParams`: File upload parameters

### Download File Part
```typescript
downloadFilePart(fileParams: {
  id: string
  partSize: number
  offsetSize: number
  dc_id: number
  access_hash: string
  file_reference: ArrayBuffer
  sizeType?: string
  originalSizeType?: string
  precise?: boolean
  thread?: number
}): Promise<Uint8Array>
```
Downloads a part of a file.

**Parameters:**
- `fileParams`: File download parameters

## Search

### Search Messages
```typescript
searchMessages(query: string, folder: Folder): Promise<SearchMessages|undefined>
```
Searches for messages in a folder.

**Parameters:**
- `query`: Search query
- `folder`: Target folder

### Reset Search
```typescript
resetSearch(): void
```
Resets the current search state.

## News Channel

### Check News Channel Joining
```typescript
checkNewsChannelJoining(): Promise<{
  joiningAvailable?: boolean
  joined?: boolean
}>
```
Checks if user can join news channel.

### Join News Channel
```typescript
joinNewsChannel(): Promise<void>
```
Joins the news channel.

## Sponsorship

### Check Sponsorship Joining
```typescript
checkSponsorshipJoining(): Promise<{
  joiningAvailable?: boolean
  joined?: boolean
}>
```
Checks if user can join sponsorship.

## Error Handling

The API uses a standardized error format:

```typescript
{
  type: 'rpc' | 'network' | 'transport' | 'internal'
  code: number
  message?: string
  method: string
}
```

## Updates System

The API implements an updates system that notifies about changes in:
- Folders
- Messages
- Search results

Updates are delivered through the `listenUpdates` method.

## Error Listening

Errors can be monitored through the `listenErrors` method. 