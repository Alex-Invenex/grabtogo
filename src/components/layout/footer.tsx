'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12">
                <img src="/logo.svg" alt="GrabtoGo Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-2xl text-white">GrabtoGo</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              We are a location-based platform where local businesses like restaurants, clothing
              stores, electronics shops, and more can showcase their latest offers, products, and
              store updates. Customers can explore nearby deals, but purchases are made in-store —
              not online.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Link
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Helpful Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Helpful Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/reviews" className="hover:text-primary transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-primary transition-colors">
                  Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="hover:text-primary transition-colors">
                  My Listings
                </Link>
              </li>
              <li>
                <Link href="/add-listing" className="hover:text-primary transition-colors">
                  Add Listing
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/listings" className="hover:text-primary transition-colors">
                  Listings
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/auth/register/vendor" className="hover:text-primary transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-400">
                  Muppathyil Building, 3rd Floor, Muttambalam P.O., Kottayam – 686004
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="tel:+917736088152"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  +91 7736088152
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:info@grabtogo.in"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  info@grabtogo.in
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} GrabtoGo. All Rights Reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
