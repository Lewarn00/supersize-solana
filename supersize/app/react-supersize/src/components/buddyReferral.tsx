import { useBuddyState, BUDDY_MEMBER } from 'buddy.link'
import React, { useCallback, useMemo, useState } from 'react'
import Invite from './buddyInvite'
import { Copy } from 'lucide-react'

interface ShareProps {
  baseUrl?: string;
}

const CopyLink: React.FC<ShareProps> = React.memo(({ baseUrl = 'https://supersize.gg'}) => {
  const [member] = useBuddyState(BUDDY_MEMBER)
  const [isCopying, setIsCopying] = useState(false) //Control loading state, prevent duplicate clicks
  const [textContet, setTextContent] = useState("Copy referral link")
  const [isHovered, setIsHovered] = useState(false);
  const shareLink = useMemo(() => {
    const accountName = member?.[0]?.account?.name

    if (typeof accountName !== 'string') {
      // console.error('Expected a string but got', accountName);
      return baseUrl
    }

    return `${baseUrl}?r=${accountName}`
  }, [baseUrl, member])

  const handleCopyLink = useCallback(() => {
    setIsCopying(true)
    try {
      if (typeof window !== 'undefined') {
        // const textToCopy = shareBlink;
        navigator.clipboard
          .writeText(shareLink)
          .then(() => {
            setTextContent("Copied to clipboard");
            setTimeout(() => {
                setTextContent("Copy referral link");
            }, 1000);
            console.log('URL copied to clipboard')
          })
          .catch((err) => {
            console.error('Failed to copy URL')
          })
      }
    } catch {
      console.error('Failed to copy URL')
    } finally {
      setIsCopying(false)
    }
  }, [shareLink])

  return (
    <>
      {member && member?.length > 0 ? (
        <div
          className="h-10 w-40 bg-transparent text-sm border border-boost-secondary-yellow text-boost-secondary-yellow rounded-md font-avenir-bold active:scale-95 uppercase py-2 text-nowrap flex-grow sm:flex-none"
          onClick={() => {if(!isCopying){handleCopyLink()}}}
          style={{marginBottom:"5px"}}>
        <div className="inline-flex items-center gap-2">
        <p className="m-0" style={{ lineHeight: '1', marginBottom: '0', verticalAlign: 'middle', display:"inline", textAlign: "right", color: isHovered ? '#FFEF8A' : 'inherit' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}>{textContet}</p>
        {/* <Copy size={20} style={{ verticalAlign: 'middle', display:"inline" }} />  */}
        </div>
        </div>
      ) : null}
    </>
  )
})

CopyLink.displayName = 'CopyLink'

export default CopyLink