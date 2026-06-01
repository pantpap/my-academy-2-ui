import { Component } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [Header, RouterOutlet, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {}
