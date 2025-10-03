'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle, Linkedin } from 'lucide-react';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
  linkedin?: string;
}

interface SocialMediaLinksProps {
  socialLinks: SocialLinks;
  onChange: (links: SocialLinks) => void;
}

const socialPlatforms = [
  {
    key: 'facebook' as keyof SocialLinks,
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/yourpage',
    color: 'text-blue-600',
  },
  {
    key: 'instagram' as keyof SocialLinks,
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/yourprofile',
    color: 'text-pink-600',
  },
  {
    key: 'twitter' as keyof SocialLinks,
    label: 'Twitter / X',
    icon: Twitter,
    placeholder: 'https://twitter.com/yourhandle',
    color: 'text-sky-500',
  },
  {
    key: 'youtube' as keyof SocialLinks,
    label: 'YouTube',
    icon: Youtube,
    placeholder: 'https://youtube.com/@yourchannel',
    color: 'text-red-600',
  },
  {
    key: 'linkedin' as keyof SocialLinks,
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/company/yourcompany',
    color: 'text-blue-700',
  },
  {
    key: 'whatsapp' as keyof SocialLinks,
    label: 'WhatsApp Business',
    icon: MessageCircle,
    placeholder: '+919876543210',
    color: 'text-green-600',
  },
];

export default function SocialMediaLinks({ socialLinks, onChange }: SocialMediaLinksProps) {
  const handleChange = (platform: keyof SocialLinks, value: string) => {
    onChange({
      ...socialLinks,
      [platform]: value,
    });
  };

  return (
    <div className="space-y-4">
      {socialPlatforms.map((platform) => {
        const Icon = platform.icon;
        return (
          <div key={platform.key} className="space-y-2">
            <Label className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${platform.color}`} />
              {platform.label}
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={socialLinks[platform.key] || ''}
                onChange={(e) => handleChange(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                className="pl-10"
              />
              <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${platform.color}`} />
            </div>
          </div>
        );
      })}

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <p className="text-sm font-medium text-gray-900 mb-2">Tips:</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Add complete URLs for social media profiles (including https://)</li>
          <li>For WhatsApp, use your business phone number with country code</li>
          <li>Social links will be displayed on your store profile page</li>
          <li>Keep your profiles active and updated for better customer engagement</li>
        </ul>
      </div>
    </div>
  );
}
