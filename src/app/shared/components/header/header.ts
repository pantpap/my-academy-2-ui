import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatToolbar, MatIconButton, MatIcon],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
