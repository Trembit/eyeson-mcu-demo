// import logo from './logo.png';
import { TopAppBar, TopAppBarRow, TopAppBarSection, TopAppBarTitle, TopAppBarFixedAdjust } from '@rmwc/top-app-bar';
// import { Button } from '@rmwc/button';
import './Toolbar.css';

const Toolbar = ({ title }) => (
  <>
    <TopAppBar>
      <TopAppBarRow>
        <TopAppBarSection >
          <TopAppBarTitle>{title}</TopAppBarTitle>
        </TopAppBarSection>
      </TopAppBarRow>
    </TopAppBar>
    <TopAppBarFixedAdjust />
  </>
);

export default Toolbar;
