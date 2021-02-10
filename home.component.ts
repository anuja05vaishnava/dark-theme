import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, RouterEvent } from '@angular/router';
import { Subscription,Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HomeService } from './shared/home.service';
import { PanelService, ConfigService, ALL_REPORTS_PATH } from '@crain-app/core';
import { RouterPaths } from '@crain-app/project/shared';
import { ThemeService } from './theme.service';


@Component({
  selector: 'crain-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  isThemeDark: Observable<boolean>;
  public menuList: any = [];
  public header: string;
  public footer: string[] = [];
  private subscription: Subscription;
  public isPrint = false;
  public isReport = false;
  public currentView = null;
  private htmlTitleConst = ' | P&I Research Center';

  constructor(
    private service: HomeService,
    private cdRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    protected router: Router,
    private panelService: PanelService,
    private configService: ConfigService,
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.subscription = this.service.listenToMenu().subscribe(value => {
      this.menuList = value.menu;
      this.header = value.header;

      this.footer = value.footer;
      this.updateCurrentView(value.header);
      this.cdRef.detectChanges();
    });
    this.execAfterPageLoad(this.router);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.execAfterPageLoad(event);
        this.isReport = this.router.url === ALL_REPORTS_PATH;
      });
    this.isPrint = this.router.url.split('/').includes(RouterPaths.print);
    this.configService.addHeaderScript('adobeLaunch');
    this.isThemeDark = this.themeService.isThemeDark;
  }
  
  
// dark theme function
  toggleDarkTheme(checked) {
    this.themeService.setDarkTheme(checked.checked);
     console.log("checked >", this.isThemeDark);
    //console.log("checked >", checked.checked);
  }


  private execAfterPageLoad(event: RouterEvent | Router) {
    this.updateTitle();
    this.trackAnalytics(event);
  }

  private updateCurrentView(header) {
    this.currentView = null;
    if (header.length) {
      this.currentView = header.slice(header.indexOf('.') + 1, header.lastIndexOf('.'));
    }
  }

  private trackAnalytics(event: RouterEvent | Router) {
    if (!this.configService.isLocalhost()) {
      this.panelService.pageTrack(event.url);
    }
  }

  private updateTitle() {
    const segments = [];
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
      const title = route.snapshot.data.title;
      if (title && !segments.includes(title)) {
        segments.push(title);
      }
    }
    let finalTitle = segments.join(' | ') + this.htmlTitleConst;
    finalTitle = finalTitle.replace(/^\s\|\s/, '');
    this.panelService.setTitle(finalTitle);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
